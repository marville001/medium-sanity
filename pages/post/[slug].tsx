import { GetStaticProps } from "next";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings";

import PortableText from "react-portable-text";
import { useForm, SubmitHandler } from "react-hook-form";

interface Props {
  post: Post;
}

interface IFormInput {
  _id: string;
  name: string;
  email: string;
  comment: string;
}

const Post_ = ({ post }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log({datata: data});
    
    fetch("/api/createComment", {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((resData) => console.log({resData}))
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <main>
      <Header />

      <img
        src={urlFor(post.mainImage).url()!}
        className="w-full h-40 object-cover"
        alt=""
      />
      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light text-gray-500 mb-2 ">
          {post.description}
        </h2>

        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full "
            src={urlFor(post.author.image).url()!}
            alt=""
          />
          <p className="font-extralight text-sm">
            Blog post by{" "}
            <span className="text-green-600">{post.author.name}</span> -
            Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <div className="mt-10">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET || "production"}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={post?.body}
            className="w-full"
            serializers={{
              h1: (props: any) => {
                return <h1 className="text-2xl font-bold my-5" {...props} />;
              },
              h2: (props: any) => {
                return <h1 className="text-xl font-bold my-5" {...props} />;
              },
              normal: (props: any) => {
                return <p className="text-md font-light my-2" {...props} />;
              },
              mainImage: (props: any) => {
                <img className="w-full" {...props} />;
              },
              li: ({ children }: any) => {
                <li className="text-2xl font-bold my-5">{children}</li>;
              },
              link: ({ href, children }: any) => {
                return (
                  <a href={href} className="text-blue-500 hover:underline">
                    {children}
                  </a>
                );
              },
            }}
          />
        </div>
      </article>
      <hr className="max-w-lg my-5 border mx-auto border-yellow-500" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col p-5 my-10 max-w-2xl mx-auto"
      >
        <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
        <h4 className="text-3xl font-bold">Leave a comment below</h4>
        <hr className="py-3 mt-2" />

        <input {...register("_id")} name="_id" type="hidden" value={post._id} />

        <label className="block mb-5">
          <span className="text-gray-700 block mb-2">Name</span>
          <input
            {...register("name", { required: true })}
            name="name"
            className="shadow border rounded py-2 px-3 form-input mt-1 w-full ring-yellow-500 focus:ring-1 outline-none"
            type="text"
            placeholder="Name"
          />
        </label>
        <label className="block mb-5">
          <span className="text-gray-700 block mb-2">Email</span>
          <input
            {...register("email", { required: true })}
            name="email"
            className="shadow border rounded py-2 px-3 form-input mt-1 w-full ring-yellow-500 focus:ring-1 outline-none"
            type="email"
            placeholder="Email"
          />
        </label>
        <label className="block mb-5">
          <span className="text-gray-700 block mb-2">Comment</span>
          <textarea
            {...register("comment", { required: true })}
            name="comment"
            className="shadow border rounded py-2 px-3 form-textarea mt-1 w-full ring-yellow-500 focus:ring-1 outline-none"
            placeholder="Name"
            rows={8}
          ></textarea>
        </label>

        <div className=" flex flex-col p-5">
          {errors.name && (
            <span className="text-red-500"> - The Name Field is required</span>
          )}
          {errors.email && (
            <span className="text-red-500"> - The Email Field is required</span>
          )}
          {errors.comment && (
            <span className="text-red-500">
              {" "}
              - The Comment Field is required
            </span>
          )}
        </div>
        <input
          type="submit"
          className="bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer"
        />
      </form>
    </main>
  );
};

export default Post_;

export const getStaticPaths = async () => {
  const query = `*[_type=="post"]{
        _id,
        slug{
          current
        }
      }`;

  const post = await sanityClient.fetch(query);

  const paths = post.map((post: Post) => ({
    params: {
      slug: post.slug.current,
    },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type=="post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author->{
        name,
        image
      },
      'comment': *[
        _type == "comment" &&
        post._ref == ^._id &&
        approved == true
      ],
        description,
        mainImage,
        slug{
          current
        },
        body
      }`;

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  });

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
    revalidate: 60, // after 60seconds.. it will revalidate the old cache
  };
};
